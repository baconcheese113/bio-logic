import { expect, test } from '@playwright/test';

const DASHBOARD_ROUTE = '/#/reference/codex-streak/pipeline';
const REFERENCE_ROUTE = '/#/reference';
const LEGACY_ROUTES = [
  '/#/reference/codex-streak',
  '/#/reference/codex-streak/transfer',
  '/#/reference/codex-streak/seeding',
  '/#/reference/codex-streak/growth',
];

interface NormalizedPoint {
  x: number;
  y: number;
}

async function dragAcrossCanvas(
  page: import('@playwright/test').Page,
  canvas: import('@playwright/test').Locator,
  points: readonly NormalizedPoint[],
  releaseAtEnd = true,
): Promise<void> {
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  if (!bounds || points.length === 0) {
    throw new Error('Canvas bounds or drag points missing');
  }

  const first = points[0];
  await page.mouse.move(bounds.x + bounds.width * first.x, bounds.y + bounds.height * first.y);
  await page.mouse.down();

  for (const point of points.slice(1)) {
    await page.mouse.move(bounds.x + bounds.width * point.x, bounds.y + bounds.height * point.y, {
      steps: 8,
    });
  }

  if (releaseAtEnd) {
    await page.mouse.up();
  }
}

async function canvasSignature(
  page: import('@playwright/test').Page,
  selector: string,
): Promise<string> {
  return page.locator(selector).evaluate((node) => {
    if (!(node instanceof HTMLCanvasElement)) {
      return 'not-canvas';
    }

    const context = node.getContext('2d');
    if (!context) {
      return `${node.width}x${node.height}:non-2d`;
    }

    const { data } = context.getImageData(0, 0, node.width, node.height);
    let hash = 2166136261;

    for (let index = 0; index < data.length; index += 16) {
      hash ^= data[index] ?? 0;
      hash = Math.imul(hash, 16777619);
      hash ^= data[index + 1] ?? 0;
      hash = Math.imul(hash, 16777619);
      hash ^= data[index + 2] ?? 0;
      hash = Math.imul(hash, 16777619);
      hash ^= data[index + 3] ?? 0;
      hash = Math.imul(hash, 16777619);
    }

    return `${node.width}x${node.height}:${hash >>> 0}`;
  });
}

test('legacy codex-streak routes redirect to the single dashboard and keep reference intact', async ({ page }) => {
  await page.goto(REFERENCE_ROUTE);
  await expect(page.getByRole('heading', { name: /Colony Rendering/ })).toBeVisible();

  for (const route of LEGACY_ROUTES) {
    await page.goto(route);
    await expect(page).toHaveURL(/#\/reference\/codex-streak\/pipeline$/);
    await expect(page.locator('[data-ref="codex-streak-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-ref="streak-plate-card"]')).toBeVisible();
    await expect(page.locator('[data-ref="transfer-card"]')).toBeVisible();
    await expect(page.locator('[data-ref="seeding-card"]')).toBeVisible();
    await expect(page.locator('[data-ref="growth-card"]')).toBeVisible();
    await expect(page.locator('[data-ref="render-card"]')).toBeVisible();
    await expect(page.locator('[data-ref="medium-select"]')).toBeVisible();
  }
});

test('single dashboard reads directly from the plate on desktop and mobile', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto(DASHBOARD_ROUTE);

  const plateCanvas = page.locator('[data-ref="codex-plate-canvas"]');
  const transferCanvas = page.locator('[data-ref="transfer-input-canvas"]');
  const seedingCanvas = page.locator('[data-ref="seeding-canvas"]');
  const growthCanvas = page.locator('[data-ref="growth-canvas"]');
  const incubationSlider = page.locator('[data-ref="incubation-slider"]');
  const observationFilterSummary = page.locator('[data-ref="observation-filter-summary"]');
  const renderCanvas = page.locator('[data-ref="render-canvas"]');

  await expect(plateCanvas).toBeVisible();
  await expect(transferCanvas).toBeVisible();
  await expect(seedingCanvas).toBeVisible();
  await expect(growthCanvas).toBeVisible();
  await expect(renderCanvas).toBeVisible();
  await expect(page.locator('[data-ref="observation-filter-controls"]')).toBeVisible();
  await expect(page.locator('[data-ref="observation-light-controls"]')).toBeVisible();
  await expect(page.locator('[data-ref="inspection-card"]')).toHaveCount(0);
  await expect(page.locator('[data-ref="medium-select"]')).toBeVisible();
  await expect(page.locator('[data-ref="render-view-label"]')).toHaveText('shaded');
  await expect(observationFilterSummary).toContainText('all species');

  const webglState = await page.evaluate(() => {
    const observation = document.querySelector('[data-ref="codex-plate-canvas"]');
    const render = document.querySelector('[data-ref="render-canvas"]');

    return {
      observationWebgl:
        observation instanceof HTMLCanvasElement ? Boolean(observation.getContext('webgl2')) : false,
      renderWebgl:
        render instanceof HTMLCanvasElement ? Boolean(render.getContext('webgl2')) : false,
    };
  });

  expect(webglState.observationWebgl).toBe(true);
  expect(webglState.renderWebgl).toBe(true);

  await page.getByRole('button', { name: 'Load Sample' }).click();
  const transferBeforeMove = await canvasSignature(page, '[data-ref="transfer-input-canvas"]');
  const seedingBeforeMove = await canvasSignature(page, '[data-ref="seeding-canvas"]');

  await dragAcrossCanvas(page, transferCanvas, [
    { x: 0.18, y: 0.26 },
    { x: 0.44, y: 0.22 },
    { x: 0.68, y: 0.2 },
  ], false);

  await expect(page.locator('[data-ref="transfer-status"]')).toHaveText('Streaking');
  const transferDuringMove = await canvasSignature(page, '[data-ref="transfer-input-canvas"]');
  const seedingDuringMove = await canvasSignature(page, '[data-ref="seeding-canvas"]');

  expect(transferDuringMove).not.toBe(transferBeforeMove);
  expect(seedingDuringMove).not.toBe(seedingBeforeMove);

  const transferBounds = await transferCanvas.boundingBox();
  if (!transferBounds) {
    throw new Error('Transfer canvas bounds unavailable');
  }

  await page.mouse.move(
    transferBounds.x + transferBounds.width * 0.78,
    transferBounds.y + transferBounds.height * 0.38,
    { steps: 8 },
  );
  await page.mouse.up();

  await expect(page.locator('[data-ref="transfer-status"]')).not.toHaveText('Streaking');

  const seedingCard = page.locator('[data-ref="seeding-card"]');
  const seedingTextBeforeFilter = await seedingCard.textContent();
  const foundersBeforeFilter = seedingTextBeforeFilter?.match(/Founders:\s*(\d+)/)?.[1] ?? null;

  await incubationSlider.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, '48');

  await page.locator('[data-ref="observation-filter-strep-pyogenes"]').uncheck();
  await page.locator('[data-ref="observation-filter-strep-pneumoniae"]').uncheck();
  await page.locator('[data-ref="observation-filter-e-coli"]').uncheck();
  await page.locator('[data-ref="observation-filter-klebsiella-pneumoniae"]').uncheck();
  await expect(observationFilterSummary).toContainText('S. aureus');

  if (foundersBeforeFilter) {
    await expect(seedingCard).toContainText(`Founders: ${foundersBeforeFilter}`);
  }

  await page.getByRole('button', { name: 'Show all' }).click();
  await expect(observationFilterSummary).toContainText('all species');

  await page.getByRole('button', { name: 'Grazing' }).click();
  await expect(page.locator('[data-ref="streak-plate-card"]')).toContainText('Light: grazing');
  await page.getByRole('button', { name: 'Transmitted' }).click();
  await expect(page.locator('[data-ref="streak-plate-card"]')).toContainText('Light: transmitted');
  await page.getByRole('button', { name: 'Bench' }).click();
  await expect(page.locator('[data-ref="streak-plate-card"]')).toContainText('Light: bench');
  await page.locator('[data-ref="render-card"] summary').click();
  await page.locator('[data-ref="render-card"]').getByRole('button', { name: 'Height' }).click();
  await expect(page.locator('[data-ref="render-view-label"]')).toHaveText('height');
  await page.locator('[data-ref="render-card"]').getByRole('button', { name: 'Shaded' }).click();
  await expect(page.locator('[data-ref="render-view-label"]')).toHaveText('shaded');

  await page.locator('[data-ref="medium-select"]').selectOption('macconkey');
  await expect(page.locator('[data-ref="streak-plate-card"]')).toContainText('Medium: MacConkey');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(DASHBOARD_ROUTE);

  await expect(page.locator('[data-ref="streak-plate-card"]')).toBeVisible();
  await expect(page.locator('[data-ref="transfer-card"]')).toBeVisible();
  await expect(page.locator('[data-ref="growth-card"]')).toBeVisible();
  await expect(page.locator('[data-ref="render-card"]')).toBeVisible();
  expect(consoleErrors).not.toEqual(expect.arrayContaining([expect.stringContaining('Shader compile error')]));
});

test('transfer owns live streak input and observation plate stays passive', async ({ page }) => {
  await page.goto(DASHBOARD_ROUTE);

  const observationPlate = page.locator('[data-ref="codex-plate-canvas"]');
  const transferCanvas = page.locator('[data-ref="transfer-input-canvas"]');

  await page.getByRole('button', { name: 'Load Sample' }).click();
  const transferBeforeObservationDrag = await canvasSignature(page, '[data-ref="transfer-input-canvas"]');
  const seedingBeforeObservationDrag = await canvasSignature(page, '[data-ref="seeding-canvas"]');

  await dragAcrossCanvas(page, observationPlate, [
    { x: 0.22, y: 0.28 },
    { x: 0.58, y: 0.28 },
    { x: 0.72, y: 0.42 },
  ]);

  await expect(page.locator('[data-ref="transfer-status"]')).not.toHaveText('Streaking');
  expect(await canvasSignature(page, '[data-ref="transfer-input-canvas"]')).toBe(transferBeforeObservationDrag);
  expect(await canvasSignature(page, '[data-ref="seeding-canvas"]')).toBe(seedingBeforeObservationDrag);

  await dragAcrossCanvas(page, transferCanvas, [
    { x: 0.18, y: 0.26 },
    { x: 0.42, y: 0.22 },
    { x: 0.7, y: 0.2 },
    { x: 0.78, y: 0.34 },
  ]);

  await expect(page.locator('[data-ref="transfer-dirty-area"]')).not.toHaveText('0');
  expect(await canvasSignature(page, '[data-ref="transfer-input-canvas"]')).not.toBe(transferBeforeObservationDrag);
  expect(await canvasSignature(page, '[data-ref="seeding-canvas"]')).not.toBe(seedingBeforeObservationDrag);
});

test('phenotype sandbox distinguishes representative species through visible plate traits', async ({ page }) => {
  await page.goto(DASHBOARD_ROUTE);

  const result = await page.evaluate(async () => {
    const suffix = `?v=${Date.now()}`;
    const growth = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/growth-engine.ts${suffix}`);
    const identify = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/identify-isolates.ts${suffix}`);
    const renderSynth = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/render-synth.ts${suffix}`);
    const types = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/streak-types.ts${suffix}`);

    const species = types.DEFAULT_SPECIES;
    const speciesById = new Map(species.map((entry: { id: string }) => [entry.id, entry]));

    function maxValue(values: Float32Array): number {
      let maxSeen = 0;
      for (let index = 0; index < values.length; index += 1) {
        if (values[index] > maxSeen) maxSeen = values[index];
      }
      return maxSeen;
    }

    function simulate(speciesId: string, medium: string, hours: number) {
      const resolution = 96;
      const founders = types.createFounderGrid(species.length, resolution);
      const film = types.createFilmState(species.length, resolution);
      const speciesIndex = species.findIndex((entry: { id: string }) => entry.id === speciesId);
      const centerIndex = 48 * resolution + 48;

      founders.counts[speciesIndex][centerIndex] = 3;
      founders.lag[speciesIndex][centerIndex] = 1.5;
      founders.growthRate[speciesIndex][centerIndex] = 0.24;
      film.depositFluid[centerIndex] = 0.015;

      const biomass = growth.computeGrowth(founders, species, medium, hours, resolution);
      const render = renderSynth.computeRenderMaps(film, biomass, species, medium, resolution);
      const candidates = identify.identifyIsolatedCandidates(biomass, render, species, medium);
      const candidate = candidates[0] ?? null;

      function sampleVisuals() {
        if (!candidate) {
          return {
            colorWarmth: 0,
            pinkBias: 0,
            roughnessMean: 0,
            alphaMax: 0,
            betaMax: 0,
          };
        }

        let colonyCells = 0;
        let roughnessSum = 0;
        let redSum = 0;
        let greenSum = 0;
        let blueSum = 0;
        let alphaMax = 0;
        let betaMax = 0;

        for (let y = candidate.bounds.minY; y <= candidate.bounds.maxY; y += 1) {
          for (let x = candidate.bounds.minX; x <= candidate.bounds.maxX; x += 1) {
            const index = y * resolution + x;
            const dx = (x + 0.5) - candidate.center.x * resolution;
            const dy = (y + 0.5) - candidate.center.y * resolution;
            const distance = Math.hypot(dx, dy);
            const normalized = distance / Math.max(1, candidate.colonyRadiusCells);

            alphaMax = Math.max(alphaMax, render.hemolysisAlpha[index]);
            betaMax = Math.max(betaMax, render.hemolysisBeta[index]);

            if (normalized > 1.05 || render.albedo[index * 4 + 3] === 0) continue;

            colonyCells += 1;
            roughnessSum += render.roughness[index];
            redSum += render.albedo[index * 4];
            greenSum += render.albedo[index * 4 + 1];
            blueSum += render.albedo[index * 4 + 2];

          }
        }

        const redMean = colonyCells === 0 ? 0 : redSum / colonyCells;
        const greenMean = colonyCells === 0 ? 0 : greenSum / colonyCells;
        const blueMean = colonyCells === 0 ? 0 : blueSum / colonyCells;

        return {
          colorWarmth: ((redMean + greenMean) * 0.5) - blueMean,
          pinkBias: redMean - (greenMean + blueMean) * 0.5,
          roughnessMean: colonyCells === 0 ? 0 : roughnessSum / colonyCells,
          alphaMax,
          betaMax,
        };
      }

      const visuals = sampleVisuals();
      return {
        candidate,
        candidateCount: candidates.length,
        heightPeak: maxValue(render.height),
        colorWarmth: visuals.colorWarmth,
        pinkBias: visuals.pinkBias,
        roughnessMean: visuals.roughnessMean,
        alphaMax: visuals.alphaMax,
        betaMax: visuals.betaMax,
      };
    }

    const aureusBlood = simulate('staph-aureus', 'blood-agar', 36);
    const pyogenesBlood = simulate('strep-pyogenes', 'blood-agar', 36);
    const pneumoniaeBlood = simulate('strep-pneumoniae', 'blood-agar', 36);
    const aureusNutrient = simulate('staph-aureus', 'nutrient-agar', 36);
    const ecoliBlood = simulate('e-coli', 'blood-agar', 36);
    const ecoliMac = simulate('e-coli', 'macconkey', 36);
    const klebMac = simulate('klebsiella-pneumoniae', 'macconkey', 36);
    const aureusMac = simulate('staph-aureus', 'macconkey', 36);

    return {
      aureusBlood: aureusBlood.candidate,
      pyogenesBlood: pyogenesBlood.candidate,
      pneumoniaeBlood: pneumoniaeBlood.candidate,
      aureusNutrient: aureusNutrient.candidate,
      ecoliMac: ecoliMac.candidate,
      klebMac: klebMac.candidate,
      aureusMacCount: aureusMac.candidateCount,
      aureusMacHeightPeak: aureusMac.heightPeak,
      aureusBloodColorWarmth: aureusBlood.colorWarmth,
      aureusBloodRoughness: aureusBlood.roughnessMean,
      pyogenesBloodRoughness: pyogenesBlood.roughnessMean,
      pneumoniaeBloodAlphaMax: pneumoniaeBlood.alphaMax,
      ecoliBloodColorWarmth: ecoliBlood.colorWarmth,
      ecoliBloodPinkBias: ecoliBlood.pinkBias,
      ecoliMacPinkBias: ecoliMac.pinkBias,
      ecoliMacRoughness: ecoliMac.roughnessMean,
      klebMacRoughness: klebMac.roughnessMean,
      speciesKnown: Array.from(speciesById.keys()),
    };
  });

  expect(result.speciesKnown).toContain('strep-pneumoniae');
  expect(result.aureusBlood).not.toBeNull();
  expect(result.pyogenesBlood).not.toBeNull();
  expect(result.pneumoniaeBlood).not.toBeNull();
  expect(result.aureusNutrient).not.toBeNull();
  expect(result.ecoliMac).not.toBeNull();
  expect(result.klebMac).not.toBeNull();

  expect(result.pyogenesBlood.localHemolysisSignal).toBeGreaterThan(result.aureusBlood.localHemolysisSignal);
  expect(result.pyogenesBlood.colonyDiameterMm).toBeLessThan(result.aureusBlood.colonyDiameterMm);
  expect(result.pyogenesBloodRoughness).toBeGreaterThan(result.aureusBloodRoughness);
  expect(result.aureusBloodColorWarmth).toBeGreaterThan(result.ecoliBloodColorWarmth);
  expect(result.pneumoniaeBloodAlphaMax).toBeGreaterThan(0.02);
  expect(result.pneumoniaeBlood.morphologyLabel).toBe('draughtsman-like');
  expect(result.aureusNutrient.hemolysisLabel).toBe('no hemolysis');
  expect(result.aureusNutrient.localHemolysisSignal).toBeLessThan(0.01);
  expect(result.ecoliMac.differentialLabel).toContain('lactose fermenter');
  expect(result.klebMacRoughness).toBeLessThan(result.ecoliMacRoughness);
  expect(result.klebMac.colonyDiameterMm).toBeGreaterThan(result.ecoliMac.colonyDiameterMm);
  expect(result.aureusMacCount).toBe(0);
  expect(result.aureusMacHeightPeak).toBeLessThan(0.001);
});

test('render synth stays deterministic and keeps wet and groove maps stable across incubation changes', async ({ page }) => {
  await page.goto(DASHBOARD_ROUTE);

  const result = await page.evaluate(async () => {
    const suffix = `?v=${Date.now()}`;
    const growth = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/growth-engine.ts${suffix}`);
    const renderSynth = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/render-synth.ts${suffix}`);
    const types = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/streak-types.ts${suffix}`);

    const resolution = 64;
    const species = types.DEFAULT_SPECIES;
    const film = types.createFilmState(species.length, resolution);
    const founders = types.createFounderGrid(species.length, resolution);

    for (let x = 18; x <= 46; x += 1) {
      const centerIndex = 20 * resolution + x;
      film.depositFluid[centerIndex] = 0.02;
      film.groove[centerIndex] = 0.35;
    }

    const founderCells = [
      { speciesIndex: 0, x: 20, y: 20 },
      { speciesIndex: 1, x: 32, y: 32 },
      { speciesIndex: 2, x: 44, y: 22 },
    ];

    for (const founder of founderCells) {
      const index = founder.y * resolution + founder.x;
      founders.counts[founder.speciesIndex][index] = 4;
      founders.lag[founder.speciesIndex][index] = 1.5;
      founders.growthRate[founder.speciesIndex][index] = 0.24;
    }

    const biomassAtZero = growth.computeGrowth(founders, species, 'blood-agar', 0, resolution);
    const biomassAtFortyEight = growth.computeGrowth(founders, species, 'blood-agar', 48, resolution);

    const renderZeroA = renderSynth.computeRenderMaps(film, biomassAtZero, species, 'blood-agar', resolution);
    const renderZeroB = renderSynth.computeRenderMaps(film, biomassAtZero, species, 'blood-agar', resolution);
    const renderFortyEight = renderSynth.computeRenderMaps(film, biomassAtFortyEight, species, 'blood-agar', resolution);

    function arraysEqual(left: ArrayLike<number>, right: ArrayLike<number>): boolean {
      if (left.length !== right.length) return false;
      for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) return false;
      }
      return true;
    }

    function maxInSquare(values: Float32Array, centerX: number, centerY: number, radius: number): number {
      let maxSeen = 0;
      for (let y = Math.max(0, centerY - radius); y <= Math.min(resolution - 1, centerY + radius); y += 1) {
        for (let x = Math.max(0, centerX - radius); x <= Math.min(resolution - 1, centerX + radius); x += 1) {
          const value = values[y * resolution + x];
          if (value > maxSeen) maxSeen = value;
        }
      }
      return maxSeen;
    }

    function maxValue(values: Float32Array): number {
      let maxSeen = 0;
      for (let index = 0; index < values.length; index += 1) {
        if (values[index] > maxSeen) maxSeen = values[index];
      }
      return maxSeen;
    }

    function fractionAbove(values: Float32Array, threshold: number): number {
      let inside = 0;
      let above = 0;

      for (let y = 0; y < resolution; y += 1) {
        for (let x = 0; x < resolution; x += 1) {
          const nx = (x + 0.5) / resolution - 0.5;
          const ny = (y + 0.5) / resolution - 0.5;
          if (nx * nx + ny * ny > 0.25) continue;

          inside += 1;
          if (values[y * resolution + x] > threshold) above += 1;
        }
      }

      return inside === 0 ? 0 : above / inside;
    }

    return {
      deterministic:
        arraysEqual(renderZeroA.height, renderZeroB.height) &&
        arraysEqual(renderZeroA.albedo, renderZeroB.albedo) &&
        arraysEqual(renderZeroA.roughness, renderZeroB.roughness) &&
        arraysEqual(renderZeroA.wetMask, renderZeroB.wetMask) &&
        arraysEqual(renderZeroA.grooveMask, renderZeroB.grooveMask) &&
        arraysEqual(renderZeroA.hemolysisAlpha, renderZeroB.hemolysisAlpha) &&
        arraysEqual(renderZeroA.hemolysisBeta, renderZeroB.hemolysisBeta),
      wetSame: arraysEqual(renderZeroA.wetMask, renderFortyEight.wetMask),
      grooveSame: arraysEqual(renderZeroA.grooveMask, renderFortyEight.grooveMask),
      heightChanged: !arraysEqual(renderZeroA.height, renderFortyEight.height),
      zeroHeightMax: maxValue(renderZeroA.height),
      zeroAlphaMax: maxValue(renderZeroA.hemolysisAlpha),
      zeroBetaMax: maxValue(renderZeroA.hemolysisBeta),
      betaHaloFraction: fractionAbove(renderFortyEight.hemolysisBeta, 0.05),
      betaHaloMax: maxInSquare(renderFortyEight.hemolysisBeta, 20, 20, 6),
      alphaHaloMax: maxInSquare(renderFortyEight.hemolysisAlpha, 44, 22, 6),
      pyogenesBetaMax: maxInSquare(renderFortyEight.hemolysisBeta, 32, 32, 6),
    };
  });

  expect(result.deterministic).toBe(true);
  expect(result.wetSame).toBe(true);
  expect(result.grooveSame).toBe(true);
  expect(result.heightChanged).toBe(true);
  expect(result.zeroHeightMax).toBeLessThan(0.02);
  expect(result.zeroAlphaMax).toBeLessThan(0.001);
  expect(result.zeroBetaMax).toBeLessThan(0.001);
  expect(result.betaHaloFraction).toBeLessThan(0.22);
  expect(result.betaHaloMax).toBeGreaterThan(0.05);
  expect(result.alphaHaloMax).toBeGreaterThan(0.03);
  expect(result.pyogenesBetaMax).toBeGreaterThan(0.05);
});
