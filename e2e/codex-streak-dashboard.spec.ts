import { expect, test } from '@playwright/test';

const DASHBOARD_ROUTE = '/#/reference/codex-streak/pipeline';
const REFERENCE_ROUTE = '/#/reference';
const LEGACY_ROUTES = [
  '/#/reference/codex-streak',
  '/#/reference/codex-streak/transfer',
  '/#/reference/codex-streak/seeding',
  '/#/reference/codex-streak/growth',
];

test('legacy codex-streak routes redirect to the single dashboard and keep reference intact', async ({ page }) => {
  await page.goto(REFERENCE_ROUTE);
  await expect(page.getByRole('heading', { name: 'Colony Rendering — Reference Lab' })).toBeVisible();

  for (const route of LEGACY_ROUTES) {
    await page.goto(route);
    await expect(page).toHaveURL(/#\/reference\/codex-streak\/pipeline$/);
    await expect(page.locator('[data-ref="codex-streak-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-ref="streak-plate-card"]')).toBeVisible();
    await expect(page.locator('[data-ref="transfer-card"]')).toBeVisible();
    await expect(page.locator('[data-ref="seeding-card"]')).toBeVisible();
    await expect(page.locator('[data-ref="growth-card"]')).toBeVisible();
    await expect(page.locator('[data-ref="render-card"]')).toBeVisible();
  }
});

test('single dashboard stays interactive on desktop and mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto(DASHBOARD_ROUTE);

  const plateCanvas = page.locator('[data-ref="codex-plate-canvas"]');
  const dirtyArea = page.locator('[data-ref="transfer-dirty-area"]');
  const changedCells = page.locator('[data-ref="founder-changed-cells"]');
  const growthNutrient = page.locator('[data-ref="growth-nutrient"]');
  const incubationHours = page.locator('[data-ref="incubation-hours"]');
  const incubationSlider = page.locator('[data-ref="incubation-slider"]');
  const renderHeightPeak = page.locator('[data-ref="render-height-peak"]');

  await expect(plateCanvas).toBeVisible();
  await expect(dirtyArea).toHaveText('0');
  await expect(page.locator('[data-ref="render-card"]')).toBeVisible();

  const initialNutrient = await growthNutrient.textContent();

  await page.getByRole('button', { name: 'Load Sample' }).click();

  const box = await plateCanvas.boundingBox();
  if (!box) {
    throw new Error('Plate canvas is missing a bounding box.');
  }

  await page.mouse.move(box.x + box.width * 0.34, box.y + box.height * 0.34);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.66, box.y + box.height * 0.52, { steps: 12 });
  await page.mouse.up();

  await expect.poll(async () => Number(await dirtyArea.textContent())).toBeGreaterThan(0);
  await expect.poll(async () => Number(await changedCells.textContent())).toBeGreaterThan(0);

  await incubationSlider.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, '0');

  await expect(incubationHours).toHaveText('0h');
  const renderHeightAtZero = Number(await renderHeightPeak.textContent());

  await incubationSlider.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, '48');

  await expect(incubationHours).toHaveText('48h');
  await expect.poll(async () => await growthNutrient.textContent()).not.toBe(initialNutrient);
  await expect.poll(async () => Number(await renderHeightPeak.textContent())).toBeGreaterThan(renderHeightAtZero);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(DASHBOARD_ROUTE);

  await expect(page.locator('[data-ref="codex-streak-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-ref="streak-plate-card"]')).toBeVisible();
  await expect(page.locator('[data-ref="growth-card"]')).toBeVisible();
  await expect(page.locator('[data-ref="render-card"]')).toBeVisible();
});

test('render synth is deterministic and keeps wet and groove maps stable across incubation changes', async ({ page }) => {
  await page.goto(DASHBOARD_ROUTE);

  const result = await page.evaluate(async () => {
    const suffix = `?v=${Date.now()}`;
    const growth = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/growth-engine.ts${suffix}`);
    const renderSynth = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/render-synth.ts${suffix}`);
    const types = await import(`/prototypes/svelte-lab-avatar/components/reference/codex-streak/streak-types.ts${suffix}`);

    const resolution = 64;
    const species = [
      { ...types.DEFAULT_SPECIES[0], hemolysisType: 'beta' },
      { ...types.DEFAULT_SPECIES[1], hemolysisType: 'alpha', color: '#b9c18b' },
      { ...types.DEFAULT_SPECIES[2], hemolysisType: 'gamma' },
    ];
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

    const biomassAtZero = growth.computeGrowth(founders, species, 0, resolution);
    const biomassAtFortyEight = growth.computeGrowth(founders, species, 48, resolution);

    const renderZeroA = renderSynth.computeRenderMaps(film, biomassAtZero, species, resolution);
    const renderZeroB = renderSynth.computeRenderMaps(film, biomassAtZero, species, resolution);
    const renderFortyEight = renderSynth.computeRenderMaps(film, biomassAtFortyEight, species, resolution);

    function arraysEqual(left, right) {
      if (left.length !== right.length) return false;
      for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) return false;
      }
      return true;
    }

    function maxInSquare(values, centerX, centerY, radius) {
      let maxValue = 0;
      for (let y = Math.max(0, centerY - radius); y <= Math.min(resolution - 1, centerY + radius); y += 1) {
        for (let x = Math.max(0, centerX - radius); x <= Math.min(resolution - 1, centerX + radius); x += 1) {
          const value = values[y * resolution + x];
          if (value > maxValue) maxValue = value;
        }
      }
      return maxValue;
    }

    function maxValue(values) {
      let maxSeen = 0;
      for (let index = 0; index < values.length; index += 1) {
        if (values[index] > maxSeen) maxSeen = values[index];
      }
      return maxSeen;
    }

    function fractionAbove(values, threshold) {
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

    const heightChanged = !arraysEqual(renderZeroA.height, renderFortyEight.height);
    const wetSame = arraysEqual(renderZeroA.wetMask, renderFortyEight.wetMask);
    const grooveSame = arraysEqual(renderZeroA.grooveMask, renderFortyEight.grooveMask);

    return {
      deterministic: arraysEqual(renderZeroA.height, renderZeroB.height) &&
        arraysEqual(renderZeroA.albedo, renderZeroB.albedo) &&
        arraysEqual(renderZeroA.roughness, renderZeroB.roughness) &&
        arraysEqual(renderZeroA.wetMask, renderZeroB.wetMask) &&
        arraysEqual(renderZeroA.grooveMask, renderZeroB.grooveMask) &&
        arraysEqual(renderZeroA.hemolysisAlpha, renderZeroB.hemolysisAlpha) &&
        arraysEqual(renderZeroA.hemolysisBeta, renderZeroB.hemolysisBeta),
      wetSame,
      grooveSame,
      heightChanged,
      zeroHeightMax: maxValue(renderZeroA.height),
      zeroAlphaMax: maxValue(renderZeroA.hemolysisAlpha),
      zeroBetaMax: maxValue(renderZeroA.hemolysisBeta),
      betaHaloFraction: fractionAbove(renderFortyEight.hemolysisBeta, 0.05),
      betaHaloMax: maxInSquare(renderFortyEight.hemolysisBeta, 20, 20, 6),
      alphaHaloMax: maxInSquare(renderFortyEight.hemolysisAlpha, 32, 32, 6),
      gammaAlphaLeak: maxInSquare(renderFortyEight.hemolysisAlpha, 44, 22, 5),
      gammaBetaLeak: maxInSquare(renderFortyEight.hemolysisBeta, 44, 22, 5),
    };
  });

  expect(result.deterministic).toBe(true);
  expect(result.wetSame).toBe(true);
  expect(result.grooveSame).toBe(true);
  expect(result.heightChanged).toBe(true);
  expect(result.zeroHeightMax).toBeLessThan(0.02);
  expect(result.zeroAlphaMax).toBeLessThan(0.001);
  expect(result.zeroBetaMax).toBeLessThan(0.001);
  expect(result.betaHaloFraction).toBeLessThan(0.2);
  expect(result.betaHaloMax).toBeGreaterThan(0.05);
  expect(result.alphaHaloMax).toBeGreaterThan(0.05);
  expect(result.gammaAlphaLeak).toBeLessThan(0.01);
  expect(result.gammaBetaLeak).toBeLessThan(0.01);
});
