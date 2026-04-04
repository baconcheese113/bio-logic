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

  await expect(plateCanvas).toBeVisible();
  await expect(dirtyArea).toHaveText('0');

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
  }, '48');

  await expect(incubationHours).toHaveText('48h');
  await expect.poll(async () => await growthNutrient.textContent()).not.toBe(initialNutrient);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(DASHBOARD_ROUTE);

  await expect(page.locator('[data-ref="codex-streak-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-ref="streak-plate-card"]')).toBeVisible();
  await expect(page.locator('[data-ref="growth-card"]')).toBeVisible();
});
