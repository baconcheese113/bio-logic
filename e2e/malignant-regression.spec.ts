import { expect, test, type Page } from '@playwright/test';

interface MalignantSnapshot {
  visibleDebris: Array<{ q: number; r: number; amount: number }>;
  visibleCapillaries: Array<{ q: number; r: number; sprout: boolean; colonized: boolean }>;
  visibleFibrous: Array<{ q: number; r: number; colonized: boolean }>;
  units: Array<{ mode: string; q: number; r: number }>;
  macrophages: Array<{ q: number; r: number; adapted: boolean }>;
  buildMode: string | null;
  temporaryVisibleCount: number;
  cameraZoom: number;
}

async function openMalignant(page: Page): Promise<void> {
  await page.goto('/prototypes/malignant/');
  await expect(page.getByLabel('Malignant hex battlefield')).toBeVisible();
  await expect
    .poll(async () => {
      return page.evaluate(() => Boolean(window.malignantDebug?.snapshot()));
    })
    .toBeTruthy();
}

async function getSnapshot(page: Page): Promise<MalignantSnapshot> {
  const snapshot = await page.evaluate(() => window.malignantDebug?.snapshot() ?? null);
  if (!snapshot) throw new Error('Malignant debug snapshot unavailable');
  return snapshot as MalignantSnapshot;
}

test('build mode can be selected and canceled from HUD', async ({ page }) => {
  await openMalignant(page);

  await page.getByRole('button', { name: /Bioreactor/i }).first().click();
  await expect
    .poll(async () => (await getSnapshot(page)).buildMode)
    .toBe('bioreactor');

  await page.getByRole('button', { name: 'Cancel build mode' }).click();
  await expect
    .poll(async () => (await getSnapshot(page)).buildMode)
    .toBeNull();
});

test('starting map shows resources/features and optional core builds are available', async ({ page }) => {
  await openMalignant(page);

  await expect(page.getByRole('button', { name: /Bioreactor/i }).first()).toBeEnabled();
  await expect(page.getByRole('button', { name: /PCR Station/i }).first()).toBeEnabled();
  await expect(page.getByRole('button', { name: /Gel Station/i }).first()).toBeEnabled();
  await expect(page.getByRole('button', { name: /Incubator/i }).first()).toBeEnabled();
  await expect(page.getByRole('button', { name: /Energy Generator/i }).first()).toBeEnabled();

  const snapshot = await getSnapshot(page);
  expect(snapshot.visibleDebris.length).toBeGreaterThanOrEqual(2);
  expect(snapshot.visibleCapillaries.length).toBeGreaterThanOrEqual(2);
  expect(snapshot.visibleFibrous.length).toBeGreaterThan(0);
  expect(snapshot.cameraZoom).toBeGreaterThanOrEqual(2.5);
});

test('units do not auto-engage macrophages outside sight', async ({ page }) => {
  await openMalignant(page);

  await page.evaluate(() => {
    window.malignantDebug?.forceClearThreats();
    window.malignantDebug?.forceSpawnWave(false);
  });

  await page.waitForTimeout(1200);
  const snapshot = await getSnapshot(page);
  expect(snapshot.macrophages.length).toBeGreaterThan(0);
  expect(snapshot.units.filter(unit => unit.mode === 'combat').length).toBe(0);
});

