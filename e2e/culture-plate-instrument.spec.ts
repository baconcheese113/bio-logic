import { expect, test, type Locator, type Page } from '@playwright/test';

async function openCentrifugeWorkbench(page: Page): Promise<void> {
  await page.goto('/');

  const closeButton = page.getByRole('button', { name: /close/i });
  if (await closeButton.count()) {
    await closeButton.click();
    await page.waitForTimeout(200);
  }

  await page.locator('[data-ref="fixture-workbench-centrifuge"]').click();
  await page.waitForTimeout(400);
  await page.locator('[data-ref="btn-open-fixture"]').click();
  await expect(page.locator('[data-ref="game-culture-plate"]')).toBeVisible();
}

async function getWorkbenchItem(page: Page, innerSelector: string): Promise<Locator> {
  return page.locator('[data-ref^="workbench-item-"]').filter({
    has: page.locator(innerSelector),
  });
}

test('full-game culture plate supports loop sterilize, streaking, and 24h incubation through the incubator', async ({ page }) => {
  await openCentrifugeWorkbench(page);

  const loop = page.locator('[data-ref^="bench-loop-"]');
  const burnerWrapper = await getWorkbenchItem(page, '[data-ref^="bench-bunsen-burner-"]');
  const incubator = page.locator('[data-ref^="bench-incubator-"]');
  const vialWrapper = await getWorkbenchItem(page, '[data-ref^="bench-sample-vial-"]');
  const vial = page.locator('[data-ref^="bench-sample-vial-"]');
  const plateWrapper = await getWorkbenchItem(page, '[data-ref="game-culture-plate"]');
  const transferCanvas = page.locator('[data-ref="game-culture-transfer-canvas"]');

  await loop.click();
  await expect(page.locator('.held-cursor')).toHaveCount(1);

  const burnerBox = await burnerWrapper.boundingBox();
  if (!burnerBox) {
    throw new Error('Burner wrapper bounds unavailable');
  }

  await page.mouse.move(
    burnerBox.x + burnerBox.width * 0.5,
    burnerBox.y + burnerBox.height * 0.12,
  );
  await expect(page.locator('main')).toContainText('Sterile');

  const plateBox = await plateWrapper.boundingBox();
  if (!plateBox) {
    throw new Error('Plate wrapper bounds unavailable');
  }

  await page.mouse.move(
    plateBox.x + plateBox.width * 0.5,
    plateBox.y + plateBox.height * 0.5,
  );
  await page.waitForTimeout(1600);

  const vialBox = await vialWrapper.boundingBox();
  if (!vialBox) {
    throw new Error('Vial wrapper bounds unavailable');
  }

  await page.mouse.move(
    vialBox.x + vialBox.width * 0.5,
    vialBox.y + vialBox.height * 0.5,
  );
  await expect(page.locator('main')).toContainText('Click to dip');
  await vial.click();

  await page.mouse.move(
    plateBox.x + plateBox.width * 0.55,
    plateBox.y + plateBox.height * 0.5,
  );
  await page.keyboard.down('q');
  await page.mouse.move(
    plateBox.x + plateBox.width * 0.95,
    plateBox.y + plateBox.height * 0.05,
  );
  await page.keyboard.down('e');

  const transferBox = await transferCanvas.boundingBox();
  if (!transferBox) {
    throw new Error('Transfer canvas bounds unavailable');
  }

  await page.mouse.move(
    transferBox.x + transferBox.width * 0.22,
    transferBox.y + transferBox.height * 0.28,
  );
  await page.mouse.down();
  await page.mouse.move(
    transferBox.x + transferBox.width * 0.46,
    transferBox.y + transferBox.height * 0.24,
    { steps: 8 },
  );
  await page.mouse.move(
    transferBox.x + transferBox.width * 0.72,
    transferBox.y + transferBox.height * 0.2,
    { steps: 8 },
  );
  await page.mouse.up();
  await page.keyboard.up('e');
  await page.keyboard.up('q');

  await expect(page.locator('[data-ref="game-culture-phase"]')).toHaveText('streaked');
  await expect(page.locator('[data-ref="game-culture-summary"]')).toHaveText('Blood Agar Plate - streaked sample');
  await expect(page.locator('[data-ref="game-culture-dirty-area"]')).not.toHaveText('Dirty area 0');

  const dirtyAfterLoadedStroke = await page.locator('[data-ref="game-culture-dirty-area"]').textContent();

  await page.mouse.move(
    burnerBox.x + burnerBox.width * 0.5,
    burnerBox.y + burnerBox.height * 0.12,
  );
  await expect(page.locator('main')).toContainText('Sterile');

  await page.mouse.move(
    plateBox.x + plateBox.width * 0.5,
    plateBox.y + plateBox.height * 0.5,
  );
  await page.waitForTimeout(1600);

  await page.keyboard.down('q');
  await page.mouse.move(
    plateBox.x + plateBox.width * 0.95,
    plateBox.y + plateBox.height * 0.05,
  );
  await page.keyboard.down('e');

  await page.mouse.move(
    transferBox.x + transferBox.width * 0.26,
    transferBox.y + transferBox.height * 0.46,
  );
  await page.mouse.down();
  await page.mouse.move(
    transferBox.x + transferBox.width * 0.42,
    transferBox.y + transferBox.height * 0.36,
    { steps: 6 },
  );
  await page.mouse.move(
    transferBox.x + transferBox.width * 0.62,
    transferBox.y + transferBox.height * 0.54,
    { steps: 6 },
  );
  await page.mouse.up();
  await page.keyboard.up('e');
  await page.keyboard.up('q');

  await expect(page.locator('[data-ref="game-culture-dirty-area"]')).not.toHaveText(dirtyAfterLoadedStroke ?? '');
  await expect(page.locator('[data-ref="game-culture-start-incubation"]')).toBeVisible();

  await incubator.click();

  await expect(page.locator('[data-ref="game-culture-phase"]')).toHaveText('grown');
  await expect(page.locator('[data-ref="game-culture-incubation"]')).toHaveText('24.0h');
  await expect(page.locator('[data-ref="game-culture-summary"]')).toContainText('24.0h incubation');
  await expect(page.locator('[data-ref="game-culture-grown-canvas"]')).toBeVisible();
  await expect(page.locator('[data-ref="game-culture-grown-note"]')).toHaveText('Use an empty loop to pick colonies.');
});
